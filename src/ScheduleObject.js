import moment from "moment";

class ScheduleObject {
  constructor(sid, date, items) {
    this.date = date;
    this.sid = sid;
    if (items === undefined) {
      this.items = [
        {
          title: "Dummy start",
          duration: "PT0S",
          startTime: moment(date),
          live: false,
          insertionType: "sentinel"
        },
        {
          title: "gap",
          startTime: moment(date),
          duration: "P1D",
          live: false,
          insertionType: "gap"
        },
        {
          title: "Dummy end",
          duration: "PT0S",
          startTime: moment(date).add(1, "days"),
          live: false,
          insertionType: "sentinel"
        }
      ];
    } else {
      this.items = items;
    }
  }

  addFloating(index, itemToAdd) {
    console.log("addFloating", index, itemToAdd, this.items);
    // keep the schedule unchanged up to the insertion point
    if (this.items[index].insertionType === "gap") {
      // remove the gap;
      this.items.splice(index, 1);
      index = index - 1; // and insert after the previous item
    }
    console.log("gap removed", this.items, index);
    let indexOfFixed = 0;
    // keep the schedule unchanged after the next fixed event
    for (let i = index + 1; i < this.items.length; i++) {
      if (this.items[i].isLive) {
        indexOfFixed = i;
        break;
      }
      if (this.items[i].insertionType === "sentinel") {
        indexOfFixed = i;
        break;
      }
    }
    console.log("indexOfFixed", indexOfFixed);
    // remove gap before fixed
    if (this.items[indexOfFixed - 1].insertionType === "gap") {
      this.items.splice(indexOfFixed - 1, 1);
      indexOfFixed--;
    }
    // calculate available space start and end
    const startOfNew = moment(this.items[index].startTime).add(
      moment.duration(itemToAdd.duration)
    );
    const end = moment(this.items[indexOfFixed].startTime);
    console.log("gap", startOfNew.utc().format(), end.utc().format());
    // add times and trim insertion to fit
    let indexPastEnd = 0;
    let start = moment(startOfNew);
    for (let i = 0; i < itemToAdd.length; i++) {
      const next = moment(start).add(moment.duration(itemToAdd[i].duration));
      if (next.isAfter(end)) {
        indexPastEnd = i;
        break;
      }
      itemToAdd[i].startTime = start;
      start = next;
    }
    let itemsThatFit = [];
    if (indexPastEnd === 0) {
      itemsThatFit = itemToAdd;
    } else {
      itemsThatFit = itemToAdd.slice(0, indexPastEnd);
    }
    // splice in new items
    this.items.splice(indexOfFixed, 0, ...itemsThatFit);

    indexOfFixed += itemsThatFit.length;
    // calculate new item total duration
    const lastNew = itemsThatFit[itemsThatFit.length - 1];
    const endOfNew = moment(lastNew.startTime).add(
      moment.duration(lastNew.duration)
    );
    const lengthOfNew = moment.duration(endOfNew.diff(startOfNew));
    console.log("length of new", lengthOfNew);
    // add new item total duration to following non-fixed events
    for (let i = indexOfFixed; i < this.items.length; i++) {
      if (this.items[i].isLive) {
        break;
      }
      if (this.items[i].insertionType === "sentinel") {
        break;
      }
      this.items[i].startTime.add(lengthOfNew);
    }
    console.log(this.items);
    // calculate end times
    const lastIndex = this.items.length - 1;
    const penultimateStart = this.items[lastIndex - 1].startTime;
    const penultimateEnd = moment(penultimateStart).add(
      moment.duration(this.items[lastIndex - 1].duration)
    );
    const sentinelStart = this.items[lastIndex].startTime;
    // amend sentinel if needed or add gap if needed
    if (penultimateEnd.isAfter(sentinelStart)) {
      // we have an event past midnight - this may be impossible at the moment
      this.items[lastIndex].startTime = penultimateEnd;
    } else if (penultimateEnd.isBefore(sentinelStart)) {
      const defaultEnd = moment(this.date).add(1, "days");
      if (penultimateEnd.isAfter(defaultEnd)) {
        // old end was even later, move it back to new end
        this.items[lastIndex].startTime = penultimateEnd;
      } else {
        // new end is before midnight. Reset sentinel and insert gap
        this.items[lastIndex].startTime = defaultEnd;
        this.items.splice(lastIndex, 0, {
          title: "gap",
          startTime: penultimateEnd,
          duration: moment
            .duration(defaultEnd.diff(penultimateEnd))
            .toISOString(),
          live: false,
          insertionType: "gap"
        });
      }
    }
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
    console.log("delete", schedule);
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
