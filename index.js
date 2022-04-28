require('dotenv').config()
const express = require('express')
const app = express()
const queryString = require('query-string')
const axios = require('axios')
const path = require('path')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI
const FRONTEND_URI = process.env.FRONTEND_URI
const PORT = process.send.PORT || 8888

app.use(express.static(path.resolve(_dirname, './client/build')))

app.get('/', (req, res) => {
  const data = {
    name: 'Lotanna',
    isAwesome: true,
  }

  res.json(data)
})

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = length => {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const stateKey = 'spotify_auth_state'

app.get('/login', (req, res) => {
  const state = generateRandomString(16)
  res.cookie(stateKey, state)

  const scope = ['user-read-private', 'user-read-email', 'user-top-read'].join(' ')

  const queryParams = queryString.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope,
  })

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`)
})

app.get('/callback', (req, res) => {
  const code = req.query.code || null

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: queryString.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      if (response.status === 200) {
        const { access_token, refresh_token } = response.data

        const queryParams = queryString.stringify({
          access_token,
          refresh_token,
        })

        res.redirect(`${FRONTEND_URI}?${queryParams}`)
      } else {
        res.redirect(`/?${queryString.stringify({ error: 'invalid_token' })}`)
      }
    })
    .catch(error => {
      res.send(error)
    })
})

app.get('/refresh_token', (req, res) => {
  const { refresh_token } = response.data

  axios
    .get(`http://localhost:8888/refresh_token?refresh_token=${refresh_token}`)
    .then(response => {
      res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`)
    })
    .catch(error => {
      res.send(error)
    })
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(_dirname, './client/build', 'index.html'))
})

// All remaining requests return the React app, so it can handle the routing.
app.listen(PORT, () => {
  console.log(`Express app listening at http://localhost:${PORT}`)
})
