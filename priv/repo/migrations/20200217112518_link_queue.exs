defmodule Bread.Repo.Migrations.LinkQueue do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :queue, :text
      add :server_playing, :integer
    end
  end
end
