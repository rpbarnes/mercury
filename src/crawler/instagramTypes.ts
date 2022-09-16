interface InstagramCount {
    count: number;
}

interface InstagramPost {
    node: {
        __typename: string;
        id: string;
        display_url: string;
        is_video: boolean;
        edge_media_to_comment?: InstagramCount;
        taken_at_timestamp: number;
        edge_liked_by?: InstagramCount;
        edge_media_preview_like?: InstagramCount;
        location?: {
            name: string;
            slug: string;
        };
        edge_media_to_caption: {
            edges: [
                {
                    node: {
                        // caption
                        text: string;
                    };
                }
            ];
        };
    };
}
// data.user...
export interface InstagramResponse {
    biography: string;
    external_url?: string;
    edge_followed_by: InstagramCount;
    edge_follow: InstagramCount;
    full_name: string;
    is_professional_account: boolean;
    business_email: string | null;
    category_name: string;
    profile_pic_url: string;
    profile_pic_url_hd: string;
    username: string;
    edge_owner_to_timeline_media: {
        count: number;
        edges: InstagramPost[];
    };
    edge_related_profiles: {
        edges: InstagramRelatedProfile[];
    };
}

interface InstagramRelatedProfile {
    node: {
        username: string;
    };
}
export interface ExternalLink {
    link: string;
    contactLink?: string;
    rawHtml: string;
    emails: string[];
}
