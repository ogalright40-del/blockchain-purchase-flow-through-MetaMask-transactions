const blockchainService = require("../services/blockchainService");

exports.getContractInfo = (req, res) => {
  try {
    const contract = blockchainService.getContract();

    if (!contract) {
      return res.json({
        connected: false
      });
    }

    res.json({
      connected: true,
      address: contract.target
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};