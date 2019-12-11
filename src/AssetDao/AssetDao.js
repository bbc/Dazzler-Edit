import axios from "axios";

const URLPrefix = (process.env.NODE_ENV === "development")?"http://localhost:8080":"";

class AssetDao {

    static getClips(sid, type, page, rowsPerPage, cb) {
        axios
        .get(`${URLPrefix}/api/v1/clip?sid=${sid}&type=${type}&page=${page+1}&page_size=${rowsPerPage}`)
        .then(cb)
        .catch(e => {
          console.log(e);
        });
    }

    static getEpisodes(sid, availability, page, rowsPerPage, cb) {
      console.log(availability);
      axios
      .get(`${URLPrefix}/api/v1/episode?sid=${sid}&page=${page}&page_size=${rowsPerPage}&availability=${availability}`)
      .then(cb)
      .catch(e => {
        console.log(e);
      });
  }

}
export default AssetDao;
