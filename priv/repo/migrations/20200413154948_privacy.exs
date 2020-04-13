defmodule Bread.Repo.Migrations.Privacy do
  use Ecto.Migration

  def change do
    alter table(:room) do
      remove :public
    end
  end
end
