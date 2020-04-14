defmodule Bread.Rooms.Room do
  use Ecto.Schema
  import Ecto.Changeset

  alias Bread.Accounts.User
  alias Bread.Rooms.Link


  schema "room" do
    field :name, :string
    field :description, :string
    field :title, :string
    field :queue, :string
    field :server_playing, :integer

    field :privacy, :integer
    field :invite_code, :string
    field :unregistered_users_allowed, :boolean
    field :custom_url, :boolean


    field :open, :boolean
    field :remote_available, :boolean

    belongs_to :user, User
    belongs_to :remote_holder, User
    belongs_to :current_link, Link

    has_many :links, Link

    timestamps()
  end

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, [:name, :title, :description, :queue, :server_playing, :user_id, :privacy, :unregistered_users_allowed, :current_link_id, :custom_url])
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/, message: "Room address should only contain numbers, letters and underscores")
    |> validate_required([:name, :user_id])
    |> unique_constraint(:name)
    |> unique_constraint(:name, name: :lower_case_roomname)
    |> validate_length(:name, max: 64)
    |> validate_length(:title, max: 100)
    |> foreign_key_constraint(:user_id)
    |> put_invite_code()
  end

  def edit_changeset(model, params \\ %{}) do
    model
    |> cast(params, [:title, :description, :queue, :server_playing, :privacy, :unregistered_users_allowed, :current_link_id])
    |> validate_length(:title, max: 100)
  end

  def put_invite_code(changeset) do
    invite_code = :crypto.strong_rand_bytes(15) |> Base.url_encode64 |> binary_part(0, 15)
    case changeset.valid? do
      true -> put_change(changeset, :invite_code, invite_code)
      false -> changeset
    end
  end

end

