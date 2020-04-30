defmodule Qwatch.Repo.Migrations.CurrentLink do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :current_link_id, references(:link, on_delete: :nilify_all)
    end
  end
end
