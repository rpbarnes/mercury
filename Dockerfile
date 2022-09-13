FROM amazon/aws-lambda-nodejs:14

# Allow AWS credentials to be supplied when building this container locally for testing,
# so S3 can be accessed
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=us-east-2

# Install Chrome to get all of the dependencies installed
ADD https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm chrome.rpm
RUN yum install -y ./chrome.rpm

# ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
#     AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
#     AWS_REGION=$AWS_REGION

# Copy files into the container
COPY package.json ${LAMBDA_TASK_ROOT}
# Install, build and test the Puppeteer app and Chrome
RUN npm install

COPY src/crawler/crawler.ts ${LAMBDA_TASK_ROOT}

# Lambda handler path
CMD [ "crawler.handler" ]