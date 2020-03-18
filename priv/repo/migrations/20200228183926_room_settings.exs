defmodule Bread.Repo.Migrations.RoomSettings do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :name_normalized, :text
      add :privacy, :integer, default: 0
      add :invite_code, :text
      add :unregistered_users_allowed, :boolean, default: true

    end

    alter table(:user) do
      add :name_normalized, :text
      add :email_normalized, :text

    end

    create unique_index(:room, [:name_normalized])
    create unique_index(:user, [:name])
    create unique_index(:user, [:email])
    create unique_index(:user, [:name_normalized])
    create unique_index(:user, [:email_normalized])

    create index(:room, [:invite_code])

  end
end
