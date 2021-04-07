import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/Typography";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Arrow from "@material-ui/icons/ArrowRight";
import moment from "moment";
import "moment-duration-format";
import ScheduleDialog from '../ScheduleDialog';

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  container: {
    maxHeight: '80vh',
  },
});

const columns = [
    { id: 'marker', label: '', minWidth: 0 },
    { id: 'local', label: 'Local', minWidth: 20,
    format: (value) => moment(value).format("HH:mm")
    },
    { id: 'utc', label: 'Start', minWidth: 20   },
    { id: 'title', label: 'Title', minWidth: 50 },
    { id: 'duration', label: 'Duration', minWidth: 20 },
    { id: 'action', label: 'Action', minWidth: 20 },
  ];

const ScheduleItem = ({row, index, data, selectedIndex, onDelete, onOccurenceDelete, onRowSelected}) => {
    const [open, setOpen] = useState(false);
    
    if(row.hidden) return '';

    console.log('ScheduleItem', row);

    const contents = (column, value) => {
        switch(column.id) {
            case 'marker':
                const arrowStyle = (row.insertionType === "gap")?"midarrow": "bottomarrow";
                if(index === selectedIndex) return (<Arrow className={arrowStyle} />)
                return '';
            case 'title':
            default:
                if (row.insertionType === "overlap") {
                    console.log('overlap', row);
                    const asset_duration = moment.duration(row.asset.duration);
                    const overlap = moment.duration(asset_duration).subtract(moment.duration(row.duration));
                    return (<>{value}
                    <Typography fontStyle="italic">
                      (clip is{" "}{asset_duration.humanize()},{" "}
                      {overlap.humanize()}{" "}will be lost)
                    </Typography>
                    </>);
                } else {
                    return value;
                }
            case 'local':
                return moment(value).format("HH:mm");
            case 'utc':
                return moment.utc(value).format("HH:mm:ss");
            case 'duration':
                return moment.duration(value).format("HH:mm:ss", { trim: false });
            case 'action':
                if(row.insertionType === 'gap') return '';
                if(row.insertionType === 'sentinel') return '';
                return (
                    <IconButton
                    onClick={() => onDelete(index)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        setOpen(true);
                    }}        
                    ><DeleteIcon colour="primary"/>
                    </IconButton>
                );
            } 
    };

    let rowClass = row.insertionType;  
    /* make row colour red if item is not available and there is less than 30 mins left until scheduled time */
    if (row.asset && row.asset.status === "unavailable") {
      if (
        moment(row.startTime).isBetween(moment(), moment().add(30, "minutes"))
      ) {
        rowClass = "unavailable";
      } else {
        rowClass = "noStart";
      }
    }

    return (
    <>
        <TableRow 
         onClick={() => onRowSelected(index)}
        className={rowClass} hover role="checkbox" 
        tabIndex={-1} key={row.startTime}
        >
        {columns.map((column) => {
        const value = row[column.id];
        return (
           <TableCell key={column.id} align={column.align}>
               {contents(column, value)}
          </TableCell>
        );
        })}
        </TableRow>
        <ScheduleDialog
            open={open}
            row={row}
            data={data}
            index={index}
            onOccurenceDelete={onOccurenceDelete}
            onClose={() => setOpen(false)}
            />
    </>
    );
};

const wanted = (row, from, to) => {
    if (row.insertionType === 'sentinel') return false;
    if (row.startTime.isBefore(from)) return false;
    if (row.startTime.isAfter(to)) return false;
    return true;
};

export default function ScheduleView({row, data, from, to, onDelete, onOccurenceDelete, onRowSelected}) {
    const classes = useStyles();

    let selectedIndex = row;
    if (selectedIndex === -1) {
        selectedIndex = data.findIndex((row) => row.insertionType === 'gap');
        onRowSelected(selectedIndex);
    }

    console.log('ScheduleView', row, selectedIndex);

    const rows = data.map((row) => {
        return {
            ...row,
            utc: row.startTime.toISOString(),
            local: row.startTime.toISOString(),
            hidden: !wanted(row, from, to),
        };
    });
    return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
            {columns.map((column) => (
                <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
            ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              return (
                <ScheduleItem
                    row={row}
                    index={index}
                    selectedIndex={selectedIndex}
                    data={data}
                    onRowSelected={onRowSelected}
                    onDelete={onDelete}                    
                    onOccurenceDelete={onOccurenceDelete}                    
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
