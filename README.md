### Kiwi IRC - A hand-crafted IRC client (modified to support Beeswax encrypted channels).

Kiwi IRC is a fully featured IRC client that can be extended to suit almost any needs.
Using the web application is extremly simple even without any IRC knowledge as all the common needs are built directly into the UI.

For more information see https://kiwiirc.com or live instance of the application can be found at https://kiwiirc.com/client/.
Our development IRC channel is on the Freenode network, irc.freenode.net #kiwiirc.

**Developing? Please use the development branch - not the master branch!**

[![Visit our IRC channel](https://kiwiirc.com/buttons/irc.freenode.net/kiwiirc.png)](https://kiwiirc.com/client/irc.freenode.net/#kiwiirc)

### Beeswax Changes

The version supports all the KiwiIRC functions, in addition to a few new client commands:

- /joinenc [&lt;streamid&gt;*]

    Join or create the encrypted channel(s) designated by the given
    stream id. A new stream and channel are created if no parameter is
    given (the new channels' name is determined by the random stream
    id obtained).

- /queryenc &lt;nick&gt;

    Create an encrypted conversation with the given user. A new stream
    and channel is created. This is shorthand for creating a new
    encrypted channel and inviting the provided user to it.

    This will establish a new friendship with the user as a side-effect.

- /inviteenc &lt;user&gt;

    Invite the given user to the current encrypted channel.
    The user must have established a frienship channel with the given user.

- (missing: a command to print/show the current streamid)

In an encrypted channel, users can toggle encryption for one message,
using the padlock icon next to the message bar.

### Installation

*Note: This requires Node.js to run. Make sure you have installed Node.js first! http://nodejs.org/download/*

1. Download the Kiwi source or clone the git repository:

    `$ git clone https://github.com/prawnsalad/KiwiIRC.git && cd KiwiIRC`

2. Install the dependencies:

    `$ npm install`

3. Copy and edit the configuration file as needed:

    `$ cp config.example.js config.js`

    `$ nano config.js`

4.  Make sure the client code is built:

    `$ ./kiwi build`


### Running
From the source folder: `$ ./kiwi start`

You can also run kiwi in the foreground to see any output by using the `-f` flag. Eg: `$ ./kiwi -f`

Open your new Kiwi instance in your browser. By default: http://localhost:7778/

### Bugs
Report bugs using the issue tracker on github: https://github.com/prawnsalad/KiwiIRC/issues

### Licence
GNU Affero
http://www.gnu.org/licenses/agpl.html


### Thanks to
The KiwiIRC logo credited to Michael Drahony (www.drahony.com)
