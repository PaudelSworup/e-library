const { default: axios } = require("axios");

const getIp = async () => {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    const externalIp = await response.data.ip;
    return externalIp
  } catch (error) {
    console.error("Error fetching external IP:", error);
  }
};

module.exports = getIp;
