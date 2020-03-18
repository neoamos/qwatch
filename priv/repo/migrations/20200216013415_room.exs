defmodule Bread.Repo.Migrations.Room do
  use Ecto.Migration

  def change do
    create table(:room) do
      add :name, :string, size: 64, null: false
      add :title, :string, size: 100
      add :user_id, references(:user, on_delete: :delete_all), null: false

      timestamps()
    end

    create unique_index(:room, [:name])
  end
end
