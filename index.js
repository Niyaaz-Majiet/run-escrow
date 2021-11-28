const express = require('express');
const Run = require('run-sdk');

const run = new Run({
    network: 'mock',
})

run.trust('*');

const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1307097",
  key: "9f3bccfa32eb736db419",
  secret: "a3ad9a8970b498ee5952",
  cluster: "eu",
  useTLS: true
});

const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

const port = 3000;

app.get('/getJigState', (req, res) => {
    const { origin } = req.query;
    const getJig = async () =>{
      try {
        const transferJig = await run.load(origin);
        await transferJig.sync();
        console.log(transferJig);
        return {
            creatorAddress:transferJig.creatorAddress,
            creatorAmount:transferJig.creatorAmount,
            creatorBlockchain:transferJig.creatorBlockchain,
            creatorEscrowAddress:transferJig.creatorEscrowAddress,
            creatorTxId:transferJig.creatorTxId,
            currentJigState:transferJig.currentJigState,
            currentState:transferJig.currentState,
            location:transferJig.location,
            nonce:transferJig.nonce,
            origin:transferJig.origin,
            owner:transferJig.owner,
            receiverAddress:transferJig.receiverAddress,
            receiverAmount:transferJig.receiverAmount,
            receiverBlockchain:transferJig.receiverBlockchain,
            receiverEscrowAddress:transferJig.receiverEscrowAddress,
            receiverTxId:transferJig.receiverTxId,
            satoshis:transferJig.satoshis 
        };
      } catch (error) {
      return null
      }
    };
  
    const jigData = getJig();
  
    res.json({jigData});
  });

app.post('/createNewJig', (req, res) => {
  const {owner,creatorEscrowAddress,receiverEscrowAddress,creatorBlockchain,receiverBlockchain,creatorAmount,receiverAmount,receiverAddress,creatorAddress} = req.body;
  const createTransferStateJig = async () =>{
    try {
    const jig = new TransferState(owner,creatorEscrowAddress,receiverEscrowAddress,creatorBlockchain,receiverBlockchain,creatorAmount,receiverAmount,receiverAddress,creatorAddress);

    await jig.sync();

    console.log("origin",jig.origin);

    return jig.origin;
    } catch (error) {
    return null;
    }
  };

  const origin = createTransferStateJig();

  res.json({origin});
});

app.post('/updateReceiverTxId', (req, res) => {
    const { receiverTxId, origin } = req.body;
  
    const updateReceiverTxId = async () =>{
      try {
        const transferJig = await run.load(origin);
        await transferJig.sync();
        transferJig.updateReceiverTxId(receiverTxId);
        await transferJig.sync();

        console.log(transferJig.receiverTxId);

        return {updated : true}
      } catch (error) {
        console.log(error);
        return {updated : false}
      }
    }
  
    const updated = updateReceiverTxId();
    res.json({updated});
});

app.post('/updateCreatorTxId', (req, res) => {
    const { creatorTxId, origin } = req.body;
  
    const updateCreatorTxId = async () =>{
      try {
        const transferJig = await run.load(origin);
        await transferJig.sync();
        transferJig.updateCreatorTxId(creatorTxId);
        await transferJig.sync();

        console.log(transferJig.creatorTxId)

        return {updated : true}
      } catch (error) {
        console.log(error);
        return {updated : false}
      }
    }
  
    const updated = updateCreatorTxId();
    res.json({updated});
});

app.post('/completeTransfer', (req, res) => {
    const { origin } = req.body;
  
    const completeTransfer = async () =>{
      try {
        const transferJig = await run.load(origin);
        await transferJig.sync();
        transferJig.completeTransfer();
        await transferJig.sync();

        console.log(transferJig.currentState);

        return {updated : true}
      } catch (error) {
        console.log(error);
        return {updated : false}
      }
    }
  
    const updated = completeTransfer();
    res.json({updated});
});


app.listen(port, () => console.log(`Listening on port ${port}!`))


class TransferState extends Jig {
    init(owner,creatorEscrowAddress,receiverEscrowAddress,creatorBlockchain,receiverBlockchain,creatorAmount,receiverAmount,receiverAddress,creatorAddress){
        this.owner = owner;
        this.creatorBlockchain = creatorBlockchain;
        this.creatorEscrowAddress = creatorEscrowAddress;
        this.receiverBlockchain = receiverBlockchain;
        this.receiverEscrowAddress = receiverEscrowAddress;
        this.currentJigState = 'Initialized';
        this.creatorAmount = creatorAmount;
        this.creatorTxId = '';
        this.creatorAddress = creatorAddress;
        this.receiverAmount = receiverAmount;
        this.receiverTxId = '';
        this.receiverAddress = receiverAddress;
        this._updateJigState();
    }

    _updateJigState(){
        const states = ['Initialized','Waiting Transactions','Recieved Transactions','Completed'];
        const indexOfCurrentState = states.indexOf(this.currentState);
        if(indexOfCurrentState >= states.length - 1){
           throw Error('Already Completed');
        }else{
         this.currentState = states[indexOfCurrentState + 1];
        }
    }

    updateReceiverTxId(receiverTxId){
       this.receiverTxId = receiverTxId;
       if(this.creatorTxId){
         this._updateJigState()
       }
    }

    updateCreatorTxId(creatorTxId){
        this.creatorTxId = creatorTxId;
        if(this.receiverTxId){
            this._updateJigState()
        }
    }

    completeTransfer(){
      this._updateJigState();
    }
}