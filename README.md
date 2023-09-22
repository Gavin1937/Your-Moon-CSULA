CLIENT (YourMoon)
=================================================
# client
 - note that there are currently two folders named 'client'
 - so, you need to cd into the inner 'client' folder
 - run the command 'npm install' to install the necessary node packages
 - once the packages have been installed, run the command command 'npm run dev' to start the client at 'localhost:5173'

SERVER
=================================================
# server (server-side)
 - run the command 'npm install' to install to necessary node packages
 - once the packages have been installed, run the command 'npm run devStart' to start the server
 - for testing purposes, the link to the server is 'localhost:3001'

# server (moondetect-server)
 - [moondetect-server](./moondetect-server/README.md) is a server only for running moon detection algorithm on supplied images.
 - checkout its [README](./moondetect-server/README.md) for building, running, and usage

DATABASE
=================================================
 - currently, you can only run this locally since there's no server that we can use (i think in the future we can use the schools virtual machine)
 - download a program called XAMPP
 - this is a video tutorial to set up XAMPP and configure it to create a database
    - https://www.youtube.com/watch?v=pVVACLH0la0&ab_channel=TroubleChute
 - you would also have to create a database called 'LunarImages'
 - Notes:
    - table is called 'LunarImageDB'
