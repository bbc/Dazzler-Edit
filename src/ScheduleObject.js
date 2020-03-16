import moment from "moment";

class ScheduleObject {
  constructor(sid, date, items) {
    //console.log('new ScheduleObject', sid, date.format());
    this.date = date;
    this.sid = sid;
    const start = moment(date);
    if (items === undefined) {
      this.items = [
        {
          startTime: start,
          duration: "PT0S",
          insertionType: "sentinel",
          title: "Dummy Start"
        },
        {
          startTime: moment(start),
          duration: "P1D",
          insertionType: "gap",
          title: "gap"
        },
        {
          startTime: moment(start).add(1, "days"),
          duration: "PT0S",
          insertionType: "sentinel",
          title: "Dummy End"
        }
      ];
    } else {
      this.items = items;
    }
  }

  addFloating(index, assetsToAdd) {
    if (!Array.isArray(assetsToAdd)) assetsToAdd = [assetsToAdd];
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
      if (this.items[i].insertionType === "live") {
        indexOfFixed = i;
        break;
      } else {
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
    const availableDuration = moment
      .duration(end.diff(startOfNew))
      .subtract(floating_duration);
    let indexOfInsert = indexOfFixed;
    if (floating.length !== 0) {
      indexOfInsert = floating[0];
    }
    // see what we have room for
    let numItemsToAdd = 0;
    let itemsToAddDuration = moment.duration();
    for (let i = 0; i < assetsToAdd.length; i++) {
      itemsToAddDuration.add(moment.duration(assetsToAdd[i].duration));
      if (
        itemsToAddDuration.asMilliseconds() > availableDuration.asMilliseconds()
      ) {
        break;
      }
      numItemsToAdd++;
    }
    // splice in new items
    const newItems = [];
    for (let i = 0; i < numItemsToAdd; i++) {
      newItems.push({
        duration: assetsToAdd[i].duration,
        insertionType: assetsToAdd[i].insertionType,
        title: assetsToAdd[i].title,
        asset: assetsToAdd[i]
      });
    }
    this.items.splice(indexOfInsert, 0, ...newItems);
    indexOfFixed += numItemsToAdd;
    // set the start times of the added and floating items
    let s = moment(startOfNew);
    for (let i = indexOfInsert; i < indexOfFixed; i++) {
      this.items[i].startTime = moment(s);
      s.add(moment.duration(this.items[i].duration));
    }
    let newCursor = indexOfFixed;
    if (this.items[indexOfFixed].insertionType === "sentinel") {
      this.fixEndTime();
    }
    if (assetsToAdd.length > numItemsToAdd) {
      this.insertOverlapIfNeeeded(indexOfFixed, assetsToAdd[numItemsToAdd]);
      newCursor++;
    } else {
      this.insertGap(indexOfFixed);
    }
    return newCursor;
  }

  insertGap(index) {
    const gapStart = moment(this.items[index - 1].startTime).add(
      moment.duration(this.items[index - 1].duration)
    );
    const duration = moment.duration(
      this.items[index].startTime.diff(gapStart)
    );
    if (duration.asMilliseconds() >= 0) {
      this.items.splice(index, 0, {
        title: "gap",
        startTime: gapStart,
        duration: duration.toISOString(),
        insertionType: "gap"
      });
    }
  }

  insertOverlapIfNeeeded(index, asset) {
    const gapStart = moment(this.items[index - 1].startTime).add(
      moment.duration(this.items[index - 1].duration)
    );
    const duration = moment.duration(
      this.items[index].startTime.diff(gapStart)
    );
    if (duration.asMilliseconds() > 0) {
      this.items.splice(index, 0, {
        title: asset.title,
        startTime: gapStart,
        duration: duration.toISOString(),
        insertionType: "overlap",
        asset: asset
      });
    }
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

  addLive(live) {
    const item = {
      title: live.title,
      startTime: live.startTime,
      duration: live.duration,
      insertionType: "live",
      asset: live
    };
    const startTime = moment(item.startTime);
    // const endTime = moment(startTime).add(moment.duration(item.duration));
    this.removeAllGaps(); // start with no gaps
    // is this a live at midnight?
    let index = 0;
    if (startTime.isSame(this.items[0].startTime)) {
      index = 1;
      this.items.splice(index, 0, item);
    } else {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].startTime.isSame(startTime)) {
          index = i;
          break;
        }
      }
      // if the matched item is a live item do nothing DAZZLER-85, DAZZLER-89
      if ("live" !== this.items[index].insertionType) {
        this.items.push(item);
      }
      this.sort();
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].startTime.isSame(startTime)) {
          index = i;
          break;
        }
      }
      // is there an item before it we need to turn into
      // an overlap or a gap?
      const prev = this.items[index - 1];
      const slotDuration = moment.duration(startTime.diff(prev.startTime));
      const slotDurationString = slotDuration.toISOString();
      switch (prev.insertionType) {
        case "gap":
          prev.duration = slotDurationString;
          break;
        case "live": // DAZZLER-86
          if (prev.duration !== slotDurationString) {
            // DAZZLER-88
            const prevDuration = moment.duration(prev.duration);
            if (slotDuration.asSeconds() > prevDuration.asSeconds()) {
              // add all gaps back in at end
              // this.addGapAtPoint(index, endTime);
            } else {
              // should never happen
              prev.insertionType = "overlap";
              prev.duration = slotDurationString;
            }
          }
          break;
        case "sentinel":
          // do nothing
          break;
        case "":
          // do nothing
          break;
        default:
          prev.insertionType = "overlap";
          prev.duration = slotDurationString;
      }
    }
    // are there items after it we need to move?
    if (this.items[index + 1].insertionType === "sentinel") {
      // add all gaps back in at end
      // this.addGapAtPoint(index, endTime);
    } else {
      // find the next fixed item
      const next = this.findNextFixed(index + 1);
      // remove everything in-between
      const cut = this.cut(index + 1, next);
      // DAZZLER-90
      if (
        cut.length > 1 ||
        (cut.length === 1 && moment.duration(cut[0].duration).asSeconds() > 0)
      ) {
        // this.addGaps();
        // this.sort();
        // put them back in again using addFloating
        this.addFloating(index, cut);
      }
    }
    this.addGaps();
    this.sort();
    // return the index of the added item
    // brute force for now TODO make more elegant
    let newIndex = 1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].startTime.isSame(startTime)) {
        newIndex = i;
        break;
      }
    }
    return newIndex;
  }

  addGapAtPoint(index, endTime) {
    const next = this.items[index + 1].startTime;
    this.items.splice(index + 1, 0, {
      title: "gap",
      startTime: endTime,
      duration: moment.duration(next.diff(endTime)).toISOString(),
      insertionType: "gap"
    });
  }

  findNextFixed(index) {
    for (let i = index; i < this.items.length; i++) {
      if ("live" === this.items[i].insertionType) {
        return i;
      }
      if ("sentinel" === this.items[i].insertionType) {
        return i;
      }
    }
    return this.items.length - 1; // should never happen
  }

  cut(from, to) {
    const assets = [];
    for (let i = from; i < to; i++) {
      assets.push(this.items[i].asset);
    }
    this.items.splice(from, to - from);
    return assets;
  }

  addFixed(items) {
    this.items = this.items.concat([...items]);
    this.sort();
  }

  removeAllGaps() {
    let s = [];
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].insertionType !== "gap") {
        s.push(this.items[i]);
      }
    }
    this.items = s;
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
          insertionType: "gap"
        });
      }
    }
    this.items = s.concat(gaps);
  }

  // delete the item. subtract its duration from following items
  // until we get to a fixed event
  // add a gap before the fixed event
  // if deleting a live item, also look at the preceding item
  //    if a gap, delete it too
  //    if an overlap, turn it into a normal item
  // Return the index of the item just be
  deleteItemClosingGap(index) {
    let schedule = [...this.items];
    let duration = moment.duration(schedule[index].duration);

    if (schedule[index].insertionType === "live") {
      switch (schedule[index - 1].insertionType) {
        case "gap":
          duration.add(moment.duration(schedule[index - 1].duration));
          schedule.splice(index - 1, 1);
          index--;
          break;
        case "overlap": // change to ordinary item
          schedule[index - 1].insertionType = "";
          duration.add(moment.duration(schedule[index - 1].duration));
          schedule[index - 1].duration = schedule[index - 1].asset.duration;
          duration.subtract(moment.duration(schedule[index - 1].duration));
          break;
        default:
        // do nothing
      }
    }

    schedule.splice(index, 1);
    for (let i = index; i < schedule.length; i++) {
      let done = false;
      switch (schedule[i].insertionType) {
        case "gap":
          schedule[i].startTime = moment(schedule[i].startTime).subtract(
            duration
          );
          schedule[i].duration = moment
            .duration(schedule[i].duration)
            .add(duration)
            .toIsoString();
          done = true;
          break;
        case "overlap":
          schedule[i].startTime.subtract(duration);
          let finishTime = moment(schedule[i].startTime).add(
            moment.duration(schedule[i].asset.duration)
          );
          if (moment(finishTime).isBefore(moment(schedule[i + 1].startTime))) {
            schedule[i].insertionType = "";
            schedule[i].duration = schedule[i].asset.duration;
          } else {
            let itemDuration = moment(schedule[i + 1].startTime).diff(
              schedule[i].startTime
            );
            // schedule[i].startTime.subtract(duration);
            schedule[i].duration = moment.duration(itemDuration).toISOString();
            done = true;
          }

          break;

        case "sentinel":
        case "live":
          done = true;
          const newStart = moment(schedule[i - 1].startTime).add(
            moment.duration(schedule[i - 1].duration)
          );

          const newDuration = moment.duration(
            moment(schedule[i].startTime).diff(newStart)
          );

          schedule.splice(i, 0, {
            title: "gap",
            startTime: newStart,
            duration: newDuration.toISOString(),
            insertionType: "gap"
          });
          break;
        default:
          schedule[i].startTime = moment(schedule[i].startTime).subtract(
            duration
          );
      }
      if (done) break;
    }
    this.items = schedule;
    //console.log('delete end', schedule);
    if (this.items[index].insertionType === "sentinel") {
      return index - 1;
    }
    return index;
  }

  deleteAllOccurencesClosingGap(pid, index, value) {
    let start = 0;
    let end = this.items.length;
    switch (value) {
      case "deleteAllPrev":
        end = index + 1;
        break;
      case "deleteAllNext":
        start = index;
        break;
      case "deleteAll":
      default:
        break;
    }

    //Relying on length changing

    for (let i = start; i < end; i++) {
      if (
        this.items[i].asset &&
        this.items[i].asset.pid === pid &&
        //this is already checked
        this.items[i].insertionType !== "live"
      ) {
        index = this.deleteItemClosingGap(i);
        end--;
        i--;
        // if (value === "deleteAll") {
        //   i--;
        // } else {
        //   end--;
        // }
        // end--;
      }
    }
    return index;
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
