/**
 * 为 delivery_destinations 表添加 picker_id 字段
 */
exports.up = function (knex) {
  return knex.schema.alterTable("delivery_destinations", function (table) {
    table.string("picker_id").nullable().comment("担当者ID");
    table.index("picker_id");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("delivery_destinations", function (table) {
    table.dropColumn("picker_id");
  });
};
