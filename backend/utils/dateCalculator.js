const moment = require("moment");
const db = require("../db/connection");

class DateCalculator {
  constructor() {}

  async isHoliday(date) {
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const [holiday] = await db.query("SELECT * FROM destination_holidays WHERE holiday_date = ?", [
      formattedDate,
    ]);
    return holiday.length > 0;
  }

  async isOverrideWorkday(date) {
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const [workday] = await db.query(
      "SELECT * FROM destination_override_attendance WHERE work_date = ?",
      [formattedDate],
    );
    return workday.length > 0;
  }

  async calculateDeliveryDate(startDate, destinationId) {
    // 获取交付提前期
    const [destinations] = await db.query(
      "SELECT delivery_lead_time FROM delivery_destinations WHERE id = ?",
      [destinationId],
    );

    if (!destinations.length) {
      throw new Error("目的地不存在");
    }

    const leadTime = destinations[0].delivery_lead_time;
    let currentDate = moment(startDate);
    let workDaysCount = 0;

    while (workDaysCount < leadTime) {
      currentDate = currentDate.add(1, "days");

      // 检查是否是周末
      const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;

      // 检查是否是假期或临时工作日
      const isHolidayDate = await this.isHoliday(currentDate);
      const isOverrideWorkdayDate = await this.isOverrideWorkday(currentDate);

      // 如果是工作日（非周末且非假期，或是临时工作日），则计数加1
      if ((!isWeekend && !isHolidayDate) || isOverrideWorkdayDate) {
        workDaysCount++;
      }
    }

    return currentDate.format("YYYY-MM-DD");
  }
}

module.exports = new DateCalculator();
