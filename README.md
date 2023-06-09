# hop
health oracle protocol

An experimental and novel coherence protocol to allow a peer to peer network to control, analyse, share and manage decentralises machine learning.

Roadmap https://github.com/healthscience/hop/wiki

The protocol brings together four main technologies and can be deployed on any peer to peer network and storage infrastrucutre:

safeFLOW-ecs  - data science compute engine in design of entity component system
DaMaHub Network Library - Create and use Module and Reference Contracts
Messenger - route messages between BentoBox-DS or third party applications and HOP
BeeBee  AI help agent - a natural language interface to produce HOP queries.

PtoP data infrastructure - e.g. hypercore  hyperdrive hyperbee


A new CLI command line interface tool to complement is also in the works


( Old peerlink software in peerlink branch)

TEST

npm run test

INSTALL

npm install

USING
HOP connect to BentoBox-DS via a secure web socket.  Use certbot or certifcate issuer and save those in files call cert.pem and key.pm in the src folder.

You will need to write a script to start HOP or add it to the button of src/index.js file e.g. 

let options = {}
options.port = 9888
let hopSF = new HOP(options)

Call it

node src/index.js

