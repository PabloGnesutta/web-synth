IMPORTANT:
For the Frontend:
Latest Node version supported is 14.21.3
Further versions will fail to start the dev environment and build the project.

# A digital audio workstation (DAW) with custom synthesizers, effects, ability to record and export audio multi-tracks.

See it live at: https://websynth.pablognesutta.com

## Run in your local environment

```
go to /frontend and 'run npm i' and then 'npm run serve'
then go to the URL created by the CLI (usualy http://localhost:8080/)
```

### Run server

```
go to /frontend and run 'npm i' and then 'npm run build'
go to /backend
  create a 'locals.js' file, it should look like this:
  module.exports = {
    PORT: 80
  }

Note: set PORT to the one you want your app to listen to.

run 'npm i' and then 'npm start'

The server should be listening on the specified PORT and should serve the client application successfuly
```
