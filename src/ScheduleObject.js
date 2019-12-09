import moment from "moment";

class ScheduleObject {
    constructor(sid, date) {
        this.date = date;
        this.sid = sid;
        this.items = [
            {
                title: 'Dummy start',
                duration: 'PT0S',
                startTime: moment(date),
                live: false,
                insertionType: 'sentinel'
            },
            {
                title: 'gap',
                startTime: moment(date),
                duration: "P1D",
                live: false,
                insertionType: 'gap'
            },
            {
                title: 'Dummy end',
                duration: 'PT0S',
                startTime: moment(date).add(1, 'days'),
                live: false,
                insertionType: 'sentinel'
            }
        ];
    }

    addFloating(index, items) {
        // keep the schedule unchanged up to the insertion point
        if (this.state.schedule[index].insertionType === 'gap') {
            index = index - 1; // ignore the gap;
        }
        let newSchedule = this.items.slice(0, index + 1);
        let nonLiveItemsAfter = [];
        let liveItemsAfter = [];
        let sentinel = this.items.pop();
        for (let i = index; i < this.items.length; i++) {
            if (this.items[i].isLive) {
                liveItemsAfter.push(this.items[i]);
            }
            else {
                if(this.items[i].insertionType !== 'gap') {
                    nonLiveItemsAfter.push(this.items[i]);
                }
            }
        }
        this.items = newSchedule;
        this.addSequentially(items);
        this.addSequentially(nonLiveItemsAfter);
        this.items.push(sentinel); // TODO extend sentinel if last item ends past midnight
        this.addGaps();
        this.sort();
    }

    // TODO skip over live
    // TODO stop at midnight
    addSequentially(items) {
        const item = this.items[this.items.length-1];
        const start = moment(item.startTime);
        let next = moment(start).add(moment.duration(item.duration));
        for(let i=0; i<items.length; i++) {
            items[i].startTime = moment(next);
            next.add(moment.duration(items[i].duration));
        }
        this.items = this.items.concat(items);
    }

    addLive(item) {
        const startTime = moment(item.startTime);
        const endTime = moment(startTime).add(moment.duration(item.duration));
        console.log(item.duration, startTime.format(), endTime.format());
        this.items.push(item);
        this.sort();
        let index = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].startTime.isSame(startTime)) {
                index = i;
                break;
            }
        }
        if (this.items[index - 1].insertionType === 'gap') {
            this.items[index - 1].duration = moment.duration(
                startTime.diff(this.items[index - 1].startTime)
            ).toISOString()
        }
        else {
            // TODO
        }
        if (this.items[index + 1].insertionType === 'sentinel') {
            // add new gap
            const next = this.items[index + 1].startTime;
            this.items.splice(index + 1, 0, {
                title: 'gap',
                startTime: endTime,
                duration: moment.duration(next.diff(endTime)).format(),
                live: false,
                insertionType: 'gap'
            });
        }
        else {
            // TODO
        }
    }

    addFixed(items) {
        this.items = this.items.concat(items);
        this.sort();
    }

    addGaps() {
        // remove any existing gaps
        let s = [];
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].insertionType !== 'gap') {
                s.push(this.items[i]);
            }
        }
        // add gap records
        let gaps = [];
        for (let i = 0; i < s.length - 1; i++) {
            const end = moment(s[i].startTime).add(moment.duration(s[i].duration));
            console.log('g', end.format(), s[i].startTime.format(), s[i].duration);
            const next = s[i + 1].startTime;
            if (end.isBefore(next)) {
                gaps.push({
                    title: 'gap',
                    startTime: end,
                    duration: moment.duration(next.diff(end)).format(),
                    live: false,
                    insertionType: 'gap'
                });
            }
        }
        this.items = s.concat(gaps);
    }

    sort() {
        this.items.sort((a, b) => {
            return a.startTime.isAfter(b.startTime) ? 1 : b.startTime.isAfter(a.startTime) ? -1 : 0;
        });
    }
}
export default ScheduleObject;