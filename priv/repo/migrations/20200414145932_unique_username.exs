defmodule Qwatch.Repo.Migrations.UniqueUsername do
  use Ecto.Migration

  def change do
    # alter table(:user) do
    #   remove :name_normalized
    # end
  end

  def up do
    alter table(:user) do
      remove :name_normalized
    end
    alter table(:room) do
      remove :name_normalized
    end
    execute "CREATE UNIQUE INDEX lower_case_username ON \"user\" ((lower(name)));"
    execute "CREATE UNIQUE INDEX lower_case_roomname ON \"room\" ((lower(name)));"
  end

  def down do
    alter table(:user) do
      add :name_normalized, :text
    end
    alter table(:room) do
      add :name_normalized, :text
    end
    execute "drop index lower_case_username;"
    execute "drop index lower_case_roomname;"
  end
end
