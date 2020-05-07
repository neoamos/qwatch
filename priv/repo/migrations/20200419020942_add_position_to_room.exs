defmodule Qwatch.Repo.Migrations.AddPositionToRoom do
  use Ecto.Migration

  def change do
    alter table(:room) do
      add :position_seconds, :real
      add :position_duration, :real
      add :position_playing, :boolean
      add :position_at, :utc_datetime
      add :position_index, :integer
    end
  end
end
