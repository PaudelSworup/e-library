const { default: axios } = require("axios");

const getLocation = async(ip)=>{
    try {
        const response = await axios.get(`https://ipinfo.io/`);
        const externalIp = await response.data;
        return externalIp
      } catch (error) {
        console.error("Error fetching external IP:", error);
      }
}

module.exports = getLocation