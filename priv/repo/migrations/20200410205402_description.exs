defmodule Qwatch.Repo.Migrations.Description do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :description, :text
      add :custom_url, :boolean, default: false
    end
  end
end
