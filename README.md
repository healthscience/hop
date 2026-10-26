# hop
health oracle protocol

Gaia Intelligences Shape Health

Attune health by biopoiesis

An experimental and novel coherence protocol to running on a pere to peer network.

Roadmap https://github.com/healthscience/hop/wiki

The protocol brings together four main technologies and can be deployed on any peer to peer network and storage infrastrucutre:

safeFLOW-ecs  - 'scores' that resonancePulse from heli cycles. Authority for coherence ledger entry.
Library - Cues conduction of knowledge. A cue is function of biopoiesis knowledge. Kept honest via Osmosis.
BeeBee  - Help, support and orchestrator of the protocol.
PtoP -  Peer to peer infrastructure via holepunch-hop, networking and storage of data. Warm and cold peers.


TEST

npm run test

INSTALL

npm install

npm install-scripts approve --all

npm rebuild


USING
HOP connect to BentoBox-DS via a secure web socket.  Use certbot or certifcate issuer and save those in files call cert.pem and key.pm in the src folder.

You will need to write a script to start HOP or add it to the button of src/index.js file e.g. 

let options = {}
options.port = 9888
let hopSF = new HOP(options)

Call it

node src/index.js -- test-hop-storage

node src/index.js -- test-hop-storage 9822

