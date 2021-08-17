contract BtcPriceContract is UsingTellor {

  //This Contract now have access to all functions on UsingTellor

  uint256 btcPrice;
  uint256 btcRequetId = 2;

  constructor(address payable _tellorAddress) UsingTellor(_tellorAddress) public {}

  ...
}