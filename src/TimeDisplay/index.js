import { useState, useEffect } from 'react';
import moment from "moment";

function TimeDisplay({format='HH:mm', updateInterval=30000}) {
  const [dateTime, setDateTime] = useState(moment.utc());
 
 useEffect(() => {
  var timerID = setInterval( () => tick(), updateInterval );
 
  return function cleanup() {
      clearInterval(timerID);
    };
 });
 
   function tick() {
    setDateTime(moment.utc());
   }

   let gmt_message = "All Times are in GMT. The current time in GMT is "+dateTime.format(format);
    const offset = moment().format().substring(19);
    if(offset !== '+00:00') {
      const local = moment().format(format);
      gmt_message += `, your local time is ${local} which is `;
      if(offset.substring(0,1) === '+') {
        gmt_message += offset.substring(1)+" ahead of GMT.";
      } else {
        gmt_message += offset.substring(1)+" behind GMT.";
      }
    }
  
   return gmt_message;
}

export default TimeDisplay