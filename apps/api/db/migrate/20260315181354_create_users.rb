class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :username
      t.string :password_digest
      t.string :name
      t.string :avatar_url
      t.string :google_uid
      t.text :bio

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :username, unique: true
    add_index :users, :google_uid, unique: true
  end
end
