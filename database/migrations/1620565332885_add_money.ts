import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddMonies extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.float('balance', 2).defaultTo(100).notNullable
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('balance')
    })
  }
}
