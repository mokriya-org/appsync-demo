// AWS AppSync credentials
import awsAppSyncConfig from './aws-appsync-config.js'

// https://redom.js.org/
const { el, list, mount } = window.redom

// import graphql from 'graphql'
// import gql from 'graphql-tag'

// aws-appsync's client extends apollo-client's client
// with some extra aws specific options like region and authentication etc
// ref: https://github.com/awslabs/aws-mobile-appsync-sdk-js/blob/master/packages/aws-appsync/src/client.ts#L112
// import AWSAppSyncClient from 'aws-appsync'

// misc old attempts
// loaded from the `aws-amplify.js` <script> tag in the index.html
// import Amplify from 'aws-amplify'
// import Amplify from '@aws-amplify/core'
// import API, { graphqlOperation } from '@aws-amplify/api'

const Amplify = window[ 'aws-amplify' ]
const API = Amplify.API

// sweet logs
Amplify.Logger.LOG_LEVEL = 'DEBUG'

/*
 * Despite a bunch of documentation on the internet `Amplify.configration` will not work ( throws an error )
 * And whilst `Amplify.API.configure` will work for Queries and Mutations, it will NOT work for Subscriptions.
 * `Amplify.default.configure` will configure it properly for all three.
 *
 * If you don't know what Queries, Mutations and Subscriptions are
 * then you need to spend 2 hours reading https://graphql.org/learn/
 **/
// see: https://github.com/aws-amplify/amplify-js#4-graphql-api-operations
Amplify.default.configure( {
  'aws_appsync_graphqlEndpoint': awsAppSyncConfig.graphqlEndpoint,
  'aws_appsync_region': awsAppSyncConfig.region,
  'aws_appsync_authenticationType': awsAppSyncConfig.authenticationType,
  'aws_appsync_apiKey': awsAppSyncConfig.apiKey
} )

function App () {
  let _chat, _chatContainer, _usernameInput, _messageInput, _sendMessage

  let _messages

  const _el = el(
    '.app',
    _chatContainer = el(
      '.chat-container',
      _chat = list( '.chat-list', ChatMessage )
    ),
    el(
      '.input-container',
      el(
        '.username-input-container',
        _usernameInput = el( 'input.username-input', { placeholder: 'username' } )
      ),
      el(
        '.message-input-container',
        _messageInput = el( 'input.message-input', { placeholder: 'message' } ),
        _sendMessage = el( 'button.message-input-container__button', 'send' )
      )
    )
  )

  _messageInput.onkeydown = function ( evt ) {
    const key = evt.which || evt.keyCode
    if ( key === 13 ) { // Enter key
      sendMessage()
    }
  }

  _sendMessage.onclick = function () {
    sendMessage()
  }

  function sendMessage () {
    postMessage(
      {
        from: _usernameInput.value,
        content: _messageInput.value
      },
      function ( err, message ) {
        if ( err ) throw err

        console.log( 'message posted: ', message )
      }
    )

    _messageInput.value = ''
  }

  function ChatMessage () {
    let _from, _content, _timestamp

    const _el = el(
      '.chat-list-message',
      _timestamp = el( 'span.chat-list-message__timestamp' ),
      _from = el( 'span.chat-list-message__from' ),
      el( 'span.chat-list-message__separator', ':' ),
      _content = el( 'span.chat-list-message__content' )
    )

    function update ( data ) {
      _from.textContent = data.from || ''
      _content.textContent = data.content || ''
      _timestamp.textContent = new Date( Number( data.createdAt || '' ) ).toLocaleString()
    }

    return {
      el: _el,
      update
    }
  }

  function subscribe () {
    /*
     * Subscribe to new messages
     **/
    const observable = API.graphql(
      {
        query: `
      subscription SubscribeToNewMessages {
        subscribeToNewMessage {
          from
          content
        }
      }
    `
      }
    )

    const subscription = observable.subscribe(
      {
        next: function ( evtData ) {
          console.log( 'subscription event!' )
          console.log( evtData )
          const message = evtData.value.data.subscribeToNewMessage
          console.log( `${ message.from }: ${ message.content }` )

          _messages.push( message )
          const newMessages = _messages.slice( -40 )

          _messages = newMessages
          _chat.update( _messages )
        }
      }
    )

    // to unsubscribe
    window.unsub = function () {
      subscription.unsubscribe()
    }
  }

  function onmount () {
    console.log( 'app mounted' )

    getAllMessages( function ( err, result ) {
      if ( err ) throw err

      // the `resolver` (GraphQL term) DataSource DynamoDB running behind the AWS AppSync Console thingy
      // is *NOT* currently returning the chat messages sorted by `createdAt` unix mstime (31.08.2018).
      // The amount of records returned is limited at 1000 If I recall correctly (configurable at the AWS AppSync Console).
      // I did look into trying to configure the DynamoDB resolver to do that but couldn't get it to work.
      // You might have open up the actual table configuration and implement secondary indexes -- and then
      // configure the resolver to somehow take that into account.
      // That's why we sort them here on the client-side... this is clearly not ideal but works for the demo.
      const messages = (
        result.data.allMessage
        // sort by createdAt
        .sort( function ( a, b ) {
          return Number( a.createdAt ) - Number( b.createdAt )
        } )
        // keep only latest 40 messages
        .slice( -40 )
      )

      console.log( `got ${ messages.length } messages` )

      _messages = messages
      _chat.update( _messages )

      _chatContainer.style.maxHeight = '999px'

      // subscribe to new messgaes
      subscribe()
    } )
  }

  return {
    el: _el,
    onmount
  }
}

const rootEl = document.getElementById( 'root' )
mount( rootEl, App() )

window.post = function ( message ) {
  postMessage(
    {
      from: 'texas',
      content: message
    },
    function ( err, message ) {
      if ( err ) throw err
      console.log( 'message posted: ', message )
    }
  )
}

function getIpAddress ( callback ) {
  const req = new window.XMLHttpRequest()
  req.open( 'GET', 'https://ip-spot.com', true )

  req.onload = function () {
    const ip = req.responseText
    console.log( 'ip address: ' + ip )
    callback( ip )
  }

  req.send()
}

/*
 * Send an startup message just for fun.
 **/
// if ( Number( window.location.port ) > 1000 ) {
//   console.log( 'skipping startup message on dev-like environment' )
// } else {
//   getIpAddress( function ( ip ) {
//     postMessage(
//       {
//         from: `[${ ip || 'unknown' }]`,
//         content: `Demo App Loaded.`
//       },
//       function ( err, message ) {
//         if ( err ) throw err
//       }
//     )
//   } )
// }

function getAllMessages ( callback ) {
  API.graphql( {
    query: `
      query GetMessages {
        allMessage {
          content
          from
          createdAt
        }
      }
    `
  } )
  .then( function ( result ) {
    callback( null, result )
  } )
  .catch( function ( err ) {
    callback( err )
  } )
}

function postMessage ( data, callback ) {
  API.graphql( {
    query: `
      mutation PostMessage {
        createMessage(
          from: "${ data.from || 'anonymous' }"
          content: "${ data.content }"
        ) {
          content
          from
          createdAt
        }
      }
    `
  } )
  .then( function ( result ) {
    callback( null, result )
  } )
  .catch( function ( err ) {
    callback( err )
  } )
}
