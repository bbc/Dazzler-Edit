import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const newTable = () => {
    const products = [ 'test' ];
    const columns = [{
      dataField: 'id',
      text: 'Product ID'
    }, {
      dataField: 'name',
      text: 'Product Name'
    }, {
      dataField: 'price',
      text: 'Product Price'
    }];
}


ReactDOM.render(
    <App initialPlayers = {players}/>,
    
    document.getElementById('root')
  );

export default newTable;
