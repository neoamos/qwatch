defmodule Bread.Repo.Migrations.Link do
  use Ecto.Migration

  def change do
    create table(:link) do
      add :user_id, references(:user, on_delete: :nilify_all), null: true
      add :room_id, references(:room, on_delete: :delete_all), null: false

      add :link, :text
      add :title, :text
      add :description, :text
      add :image, :text
  
      timestamps()
    end

    alter table(:room) do
      add :public, :boolean, default: true
      add :open, :boolean, default: false
      add :remote_available, :boolean, default: false

      add :remote_holder_id, references(:user, on_delete: :nilify_all)
    end
  end
end
