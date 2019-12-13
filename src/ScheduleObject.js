import moment from "moment";

class ScheduleObject {
    constructor(sid, date, items) {
        console.log('new ScheduleObject', sid, date);
        this.date = date;
        this.sid = sid;
        const start = moment(date+'T00:00:00Z');
        if (items === undefined) {
            this.items = [
                {
                    title: "Dummy start",
                    duration: "PT0S",
                    startTime: start,
                    live: false,
                    insertionType: "sentinel"
                },
                {
                    title: "gap",
                    startTime: moment(start),
                    duration: "P1D",
                    live: false,
                    insertionType: "gap"
                },
                {
                    title: "Dummy end",
                    duration: "PT0S",
                    startTime: moment(start).add(1, "days"),
                    live: false,
                    insertionType: "sentinel"
                }
            ];
        } else {
            this.items = items;
        }
    }

    addFloating(index, itemsToAdd) {
        if (!Array.isArray(itemsToAdd)) itemsToAdd = [itemsToAdd];
        //console.log("addFloating", index, itemsToAdd, this.items);
        // keep the schedule unchanged up to the insertion point
        if (this.items[index].insertionType === "gap") {
            // remove the gap;
            this.items.splice(index, 1);
            index = index - 1; // and insert after the previous item
        }
        let indexOfFixed = 0;
        let floating = [];
        let floating_duration = moment.duration();
        // keep the schedule unchanged after the next fixed event
        for (let i = index + 1; i < this.items.length; i++) {
            if (this.items[i].insertionType === "gap") {
                continue;
            }
            if (this.items[i].insertionType === "sentinel") {
                indexOfFixed = i;
                break;
            }
            if (this.items[i].live) {
                indexOfFixed = i;
                break;
            }
            else {
                floating.push(i);
                floating_duration.add(moment.duration(this.items[i].duration));
            }
        }
        // remove gap before fixed
        if (this.items[indexOfFixed - 1].insertionType === "gap") {
            this.items.splice(indexOfFixed - 1, 1);
            indexOfFixed--;
        }
        // calculate available space start and end
        const startOfNew = moment(this.items[index].startTime).add(
            moment.duration(this.items[index].duration)
        );
        const end = moment(this.items[indexOfFixed].startTime);
        const availableDuration = moment.duration(end.diff(startOfNew)).subtract(floating_duration);
        let indexOfInsert = indexOfFixed;
        if (floating.length !== 0) {
            indexOfInsert = floating[0];
        }
        // see what we have room for
        let numItemsToAdd = 0;
        let itemsToAddDuration = moment.duration();
        for (let i = 0; i < itemsToAdd.length; i++) {
            itemsToAddDuration.add(moment.duration(itemsToAdd[i].duration));
            if (itemsToAddDuration.asMilliseconds() > availableDuration.asMilliseconds()) {
                break;
            }
            numItemsToAdd++;
        }
        // splice in new items
        this.items.splice(indexOfInsert, 0, ...itemsToAdd.slice(0, numItemsToAdd));
        indexOfFixed += numItemsToAdd;
        // set the start times of the added and floating items
        let s = moment(startOfNew);
        for (let i = indexOfInsert; i < indexOfFixed; i++) {
            this.items[i].startTime = moment(s);
            console.log(i, this.items[i].title, this.items[i].startTime.utc().format());
            s.add(moment.duration(this.items[i].duration));
        }
        if (this.items[indexOfFixed].insertionType === 'sentinel') {
            this.fixEndTime();
        }
        this.insertGap(indexOfFixed);
    }

    insertGap(index) {
        const gapStart = moment(this.items[index - 1].startTime).add(moment.duration(this.items[index - 1].duration));
        this.items.splice(index, 0, {
            title: "gap",
            startTime: gapStart,
            duration: moment
                .duration(this.items[index].startTime.diff(gapStart))
                .toISOString(),
            live: false,
            insertionType: "gap"
        });
    }

    fixEndTime() {
        const end = this.items.length - 1;
        const penultimateStart = this.items[end - 1].startTime;
        const penultimateEnd = moment(penultimateStart).add(
            moment.duration(this.items[end - 1].duration)
        );
        const sentinelStart = this.items[end].startTime;
        // amend sentinel if needed or add gap if needed
        if (penultimateEnd.isAfter(sentinelStart)) {
            // we have an event past midnight - this may be impossible at the moment
            this.items[end].startTime = penultimateEnd;
        } else if (penultimateEnd.isBefore(sentinelStart)) {
            const defaultEnd = moment(this.date).add(1, "days");
            if (penultimateEnd.isAfter(defaultEnd)) {
                // old end was even later, move it back to new end
                this.items[end].startTime = penultimateEnd;
            } else {
                // new end is before midnight. Reset sentinel
                this.items[end].startTime = defaultEnd;
            }
        }
    }

    addLive(item) {
        const startTime = moment(item.startTime);
        const endTime = moment(startTime).add(moment.duration(item.duration));
        this.items.push(item);
        this.sort();
        let index = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].startTime.isSame(startTime)) {
                index = i;
                break;
            }
        }
        if (this.items[index - 1].insertionType === "gap") {
            this.items[index - 1].duration = moment
                .duration(startTime.diff(this.items[index - 1].startTime))
                .toISOString();
        } else {
            // TODO
        }
        if (this.items[index + 1].insertionType === "sentinel") {
            // add new gap
            const next = this.items[index + 1].startTime;
            this.items.splice(index + 1, 0, {
                title: "gap",
                startTime: endTime,
                duration: moment.duration(next.diff(endTime)).toISOString(),
                live: false,
                insertionType: "gap"
            });
        } else {
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
            if (this.items[i].insertionType !== "gap") {
                s.push(this.items[i]);
            }
        }
        // add gap records
        let gaps = [];
        for (let i = 0; i < s.length - 1; i++) {
            const end = moment(s[i].startTime).add(moment.duration(s[i].duration));
            const next = s[i + 1].startTime;
            if (end.isBefore(next)) {
                gaps.push({
                    title: "gap",
                    startTime: end,
                    duration: moment.duration(next.diff(end)).toISOString(),
                    live: false,
                    insertionType: "gap"
                });
            }
        }
        this.items = s.concat(gaps);
    }

    // delete the item. subtract its duration from following items
    // until we get to a fixed event
    // add a gap before the fixed event
    deleteItemClosingGap(index) {
        let schedule = [...this.items];
        const duration = moment.duration(schedule[index].duration);
        schedule.splice(index, 1);
        for (let i = index; i < schedule.length; i++) {
            let done = false;
            switch (schedule[i].insertionType) {
                case "gap":
                    schedule[i].startTime.subtract(duration);
                    schedule[i].duration = moment
                        .duration(schedule[i].duration)
                        .add(duration)
                        .toIsoString();
                    done = true;
                    break;
                case "sentinel":
                case "live":
                    done = true;
                    schedule.splice(i, 0, {
                        title: "gap",
                        startTime: moment(schedule[i].startTime).subtract(duration),
                        duration: duration.toISOString(),
                        live: false,
                        insertionType: "gap"
                    });
                    break;
                default:
                    schedule[i].startTime.subtract(duration);
            }
            if (done) break;
        }
        this.items = schedule;
    }

    sort() {
        this.items.sort((a, b) => {
            return a.startTime.isAfter(b.startTime)
                ? 1
                : b.startTime.isAfter(a.startTime)
                    ? -1
                    : 0;
        });
    }
}
export default ScheduleObject;
