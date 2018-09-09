# References
https://graphql.org/learn/

https://hackernoon.com/aws-appsync-up-and-running-560a42d96ba7

https://docs.aws.amazon.com/appsync/latest/devguide/welcome.html

https://docs.aws.amazon.com/appsync/latest/devguide/designing-your-schema.html

https://github.com/aws-samples/aws-mobile-appsync-chat-starter-angular

https://aws.amazon.com/blogs/mobile/building-a-serverless-real-time-chat-application-with-aws-appsync/

# What
Minimalistic AWS AppSync demo with realtime chat using GraphQL queries, mutations and subscriptions.

# Notes
Had some trouble with aws-appsync working out of the box. aws-appsync extends the client from apollo-client and seems to be adding ontop some AWS specific black magic.

aws-amplify seems like the best library for using AWS AppSync without messing with any of the React/Angular boilerplates.

It comes with a bunch of stuff but here we're only using the basics: queries, mutations and subscriptions (no authing or login etc).

The documentation on aws-amplify is better than for aws-appsync. It's still not super great and you will come across some outdated documentation and need to fiddle around in places to get things right ( even with their very high quality examples at: https://aws-amplify.github.io/amplify-js/media/quick_start ).

The documentation and support around the internet in general for AppSync I felt like isn't super great and there are a lot of outdated documentation as well.

DynamoDB which AWS AppSync binds to default is probably not ideal for chat-like apps. Sorting by time on DynamoDB can be a pain.
ElasticSearch is supposedly also supported but have no practical experience with how it works with AppSync.

The AWS AppSync Console for designing the GraphQL schemas and resolves is actually *very nice*. But there's a learning curve and working with it can be a bit fiddly at times.

Haven't tried how it integrates with users and authentication. It seems to support AWS Cognito users pools, whatever that means in practice.

The packaging or building of the relevant libraries was also surprisingly troublesome, especially for a very basic technical setup. Not sure how much of the configuration ugliness the ready made boilerplates hide that might haunt you when integrating with a real world application. Might end up spending a lot time getting the build pipeline etc working right.

Without tree shaking the entire dependency comes to around 200kb gzipped. Not horrible but quite large. I couldn't seem to get tree shaking to work for this demo of even if it's actually supported.

Not entirely sure how the GraphQL subscriptions are implemented here either. Supposedly you can switch out and use a bunch of different implementation; That will require some additional configuration and packaging. Doesn't seem to be longpolling. Looks like a websocket implementing an mqtt protocol (looking through chrome devtools). So AWS probably runs the mqtt server within the AppSync environment for us.

# Installing
`npm install`

# Building
`npm run build`

# Running
`npm start` runs locally at `http://localhost:5000`

# Development
`npm run watch` and open browser at `http://localhost:4040`

# Config
The AWS AppSync config options ( url, api keys etc ) is at `src/aws-appsync-config.js`. These credentials can be seen and even downloaded directly from the AWS AppSync Console.

# Deployment
`now` -- this will not work for you unless you know what `now` is and you have an account at zeit.co.

# Other
The `resolver` (GraphQL term) DataSource DynamoDB running behind the AWS AppSync Console thingy
is *NOT* currently returning the chat messages sorted by `createdAt` unix mstime (31.08.2018).

The amount of records returned is limited at 1000 If I recall correctly (configurable at the AWS AppSync Console).
I did look into trying to configure the DynamoDB resolver to do that but couldn't get it to work.

You might have open up the actual table configuration and implement secondary indexes -- and then
configure the resolver to somehow take that into account.

That's why we sort them here on the client-side... this is clearly not ideal but works for the demo.
