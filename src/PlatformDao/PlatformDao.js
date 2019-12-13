import axios from "axios";

const URLPrefix = (process.env.NODE_ENV === "development")?"http://localhost:8080":"";

class PlatformDao {    
    
    static getUser(cb) {
        axios
        .get(`${URLPrefix}/api/v1/user`)
        .then(response => cb(response.data))
        .catch(e => {
            console.log(e);
        });
    }
}
export default PlatformDao;