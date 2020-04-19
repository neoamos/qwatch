defmodule Bread.Repo.Migrations.UpdateRoom do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :remote_holder_connection_id, :text
    end
  end
end
