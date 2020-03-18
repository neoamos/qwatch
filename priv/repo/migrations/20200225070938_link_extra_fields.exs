defmodule Bread.Repo.Migrations.LinkExtraFields do
  use Ecto.Migration

  def change do
    alter table(:link) do
      add :external_image, :text
      add :site_name, :text
    end
  end
end
