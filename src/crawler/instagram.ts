import { InfluencerLink, InstagramInfluencer } from '@prisma/client';
import { ElementHandle, Page } from 'puppeteer-core';
import { getBrowser } from './browser';
import { db } from './db';
import { ExternalLink, InstagramResponse } from './instagramTypes';

const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36';

export const handler = async (event: any) => {
    let browser = await getBrowser();
    const toRequest = event.usernames as string[];

    try {
        await Promise.allSettled(
            toRequest.map(async (username) => {
                let page = await browser.newPage();
                try {
                    await page.setUserAgent(agent);
                    await page.setExtraHTTPHeaders({
                        accept: '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                    });

                    const userInfo = await getInstagramUserInfo(page, username);
                    // if there's an external link call it - get html
                    let externalLinkInfo: ExternalLink | undefined = undefined;
                    if (userInfo) {
                        externalLinkInfo = await getExternalLink(page, userInfo);
                        console.log(externalLinkInfo?.emails);
                    }
                    console.log('finished page nav', userInfo);

                    // write external link to db - get db value
                    let externalLinkRecord: InfluencerLink | undefined = undefined;
                    if (externalLinkInfo) {
                        console.log('writing to db');
                        try {
                            externalLinkRecord = await writeExternalLink(externalLinkInfo);
                        } catch (error) {
                            console.log('somthing went wrong', error);
                        }
                        console.log('writing external link');
                    }

                    // write instagram user to db and populate the next to explore list
                    if (userInfo) {
                        console.log('attempting to write to db.');
                        await writeInstagramUser(userInfo, externalLinkRecord);
                        await writeNextToExplore(userInfo);
                        console.log('wrote instagram profile');
                    }

                    return userInfo;
                } catch (err) {
                    console.error(err);
                } finally {
                    await page.close();
                }
            })
        );
        await browser.close();
    } catch (error) {
        console.log(error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }

    return 'whats up';
};

const getInstagramUserInfo = async (page: Page, username: string): Promise<InstagramResponse | undefined> => {
    const url = `https://www.instagram.com/${username}/?hl=en`;
    let userInfo: InstagramInfluencer | undefined = undefined;

    console.log('Navigating to page: ', url);
    page.on('response', async (response) => {
        try {
            const url: string = response.url();
            if (url.startsWith('https://i.instagram.com/api/v1/users/web_profile_info/?username=')) {
                console.log(response.status(), 'status is');
                if (response.request().method() === 'GET') {
                    const result = await response.json();
                    if (result && result.data) {
                        userInfo = result.data.user as InstagramInfluencer;
                    }
                }
            }
        } catch (err) {
            console.error(err, 'something here');
        }
    });

    const result = await page.goto(url, { waitUntil: 'networkidle0' });
    //@ts-ignore
    // const bodyHTML: string = await page.evaluate(() => document.documentElement.outerHTML);
    // console.log('length of html is', bodyHTML.length);
    // console.log(bodyHTML);
    // const emails = extractEmails(bodyHTML) ?? [];
    return userInfo;
};

const getExternalLink = async (page: Page, userInfo: InstagramResponse): Promise<ExternalLink | undefined> => {
    if (userInfo.external_url) {
        console.log(`navigating to ${userInfo.external_url}`);
        await page.goto(userInfo.external_url, { waitUntil: 'networkidle0' });
        const emailsFound: string[] = [];
        const emailsFromBio = extractEmails(userInfo.biography);
        if (emailsFromBio) {
            emailsFound.push(...emailsFromBio);
        }
        const links = await page.$$('a');
        //@ts-ignore
        let contactLink: ElementHandle<HTMLElementTagNameMap> | undefined = undefined;
        await Promise.allSettled(
            links.map(async (link) => {
                let valueHandle = await link.getProperty('innerText');
                let linkText: string = await valueHandle.jsonValue();
                if (linkText.toLowerCase().includes('contact')) {
                    console.log('link contains a contact');
                    contactLink = link;
                }
            })
        );
        //@ts-ignore
        const bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);
        const emails = extractEmails(bodyHTML);
        if (emails) {
            emailsFound.push(...emails);
        }
        let contactUrl = '';
        if (contactLink) {
            //@ts-ignore
            contactUrl = await (await contactLink?.getProperty('href')).jsonValue();
            if (contactUrl) {
                await page.goto(contactUrl, { waitUntil: 'networkidle0' });
                //@ts-ignore
                const contactHtml = await page.evaluate(() => document.documentElement.outerHTML);
                const contactEmails = extractEmails(contactHtml);
                if (contactEmails) {
                    emailsFound.push(...contactEmails);
                }
            }
        }
        return {
            emails: emailsFound,
            contactLink: contactUrl,
            link: userInfo.external_url,
            rawHtml: bodyHTML,
        };
    }
    return;
};

const extractEmails = (html: string): string[] | null => {
    return html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
};

const writeExternalLink = async (externalLink: ExternalLink): Promise<InfluencerLink> => {
    let uniqueEmails = [...new Set(externalLink.emails)];
    return await db.influencerLink.upsert({
        create: {
            email: externalLink.emails.find(() => true),
            emails: uniqueEmails,
            rawHtml: externalLink.rawHtml,
            contactLink: externalLink.contactLink,
            link: externalLink.link,
        },
        update: {
            email: externalLink.emails.find(() => true),
            emails: uniqueEmails,
            rawHtml: externalLink.rawHtml,
            contactLink: externalLink.contactLink,
        },
        where: {
            link: externalLink.link,
        },
    });
};

const writeInstagramUser = async (userInfo: InstagramResponse, externalLink: InfluencerLink | undefined): Promise<InstagramInfluencer> => {
    const emailFromBio = extractEmails(userInfo.biography);
    const influencer = await db.instagramInfluencer.upsert({
        create: {
            userName: userInfo.username,
            biography: userInfo.biography,
            business_email: emailFromBio && emailFromBio.length > 0 ? emailFromBio[0] : userInfo.business_email,
            categoryName: userInfo.category_name,
            externalLinkId: externalLink?.id,
            followedBy: userInfo.edge_followed_by.count,
            following: userInfo.edge_follow.count,
            fullName: userInfo.full_name,
            isProfessionalAccount: userInfo.is_professional_account,
            profilePicUrl: userInfo.profile_pic_url,
            profilePicUrlHd: userInfo.profile_pic_url_hd,
            totalPosts: userInfo.edge_owner_to_timeline_media.count,
        },
        update: {
            biography: userInfo.biography,
            business_email: emailFromBio && emailFromBio.length > 0 ? emailFromBio[0] : userInfo.business_email,
            categoryName: userInfo.category_name,
            externalLinkId: externalLink?.id,
            followedBy: userInfo.edge_followed_by.count,
            following: userInfo.edge_follow.count,
            fullName: userInfo.full_name,
            isProfessionalAccount: userInfo.is_professional_account,
            profilePicUrl: userInfo.profile_pic_url,
            profilePicUrlHd: userInfo.profile_pic_url_hd,
            totalPosts: userInfo.edge_owner_to_timeline_media.count,
        },
        where: {
            userName: userInfo.username,
        },
    });

    const raw = await db.instagramRaw.createMany({
        data: {
            userId: influencer.id,
            rawPayload: userInfo as {},
        },
        skipDuplicates: true,
    });

    const existingPosts = await db.instagramPost.findMany({
        where: {
            postUrl: {
                in: userInfo.edge_owner_to_timeline_media.edges.map((post) => post.node.display_url),
            },
        },
    });
    if (existingPosts.length > 0) {
        db.instagramPost.deleteMany({
            where: {
                postUrl: {
                    in: existingPosts.map((post) => post.postUrl),
                },
            },
        });
    }
    await db.instagramPost.createMany({
        data: userInfo.edge_owner_to_timeline_media.edges.map((post) => {
            return {
                postUrl: post.node.display_url,
                likes: post.node.edge_liked_by?.count,
                comments: post.node.edge_media_to_comment?.count,
                views: post.node.edge_media_preview_like?.count,
                isVideo: post.node.is_video,
                takenAt: new Date(post.node.taken_at_timestamp),
                locationName: post.node.location?.name,
                locationSlug: post.node.location?.slug,
                caption: post.node.edge_media_to_caption.edges.length > 0 ? post.node.edge_media_to_caption.edges[0].node.text : '',
                instagramId: post.node.id,
            };
        }),
        skipDuplicates: true,
    });

    const newPosts = await db.instagramPost.findMany({
        where: {
            instagramId: { in: userInfo.edge_owner_to_timeline_media.edges.map((post) => post.node.id) },
        },
    });

    const valuesToWrite: {
        postId: number;
        hashtag: string;
    }[] = [];
    userInfo.edge_owner_to_timeline_media.edges.map((post) => {
        const caption = post.node.edge_media_to_caption.edges.length > 0 ? post.node.edge_media_to_caption.edges[0].node.text : '';
        const tags = getHashtags(caption);
        return tags.map((tag) => {
            const curr = newPosts.find((newpost) => newpost.instagramId === post.node.id)?.id;
            if (curr) {
                valuesToWrite.push({
                    postId: curr,
                    hashtag: tag,
                });
            }
        });
    });

    await db.instagramPostHashtag.createMany({
        data: valuesToWrite,
        skipDuplicates: true,
    });

    return influencer;
};

const getHashtags = (caption: string): string[] => {
    const tags = caption.match(/\B\#\w\w+\b/g);
    return tags ? tags : [];
};

const writeNextToExplore = async (userInfo: InstagramResponse): Promise<void> => {
    await db.instagramCrawl.createMany({
        data: userInfo.edge_related_profiles.edges.map((profile) => {
            return {
                username: profile.node.username,
            };
        }),
        skipDuplicates: true,
    });
};
