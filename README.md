IMPORTANT:
For the Frontend:
Latest Node version supported is 14.21.3
Further versions will fail to start the dev environment and build the project.


# A digital audio workstation (DAW) with custom synthesizers, effects, ability to record and export audio multi-tracks.

See it live at: https://websynth.pablognesutta.com

## Run in your local environment
```
go to /frontend and 'run npm install' and then run 'npm run serve' 
then go to the URL created by the CLI (usually http://localhost:8080/)
```

### Deploy to cloud server
```
go to /frontend and run 'npm install'
still in /frontend run 'npm run build'
deploy your /backend directory to your cloud server
in your cloud server go to that /backend directory and create a 'locals.js' file, that should look like this:

module.exports = {
  PORT: 80,
}
//the PORT should be set to be the one where you want your app to run, usually port 80.

save the file and then, still in /backend run 'npm install' and then 'npm start'
Enjoy!
```
