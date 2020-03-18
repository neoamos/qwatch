defmodule Bread.Accounts.User do
  use Ecto.Schema
  use Coherence.Schema
  import Ecto.Changeset


  schema "user" do
    field :name,     :string
    field :name_normalized, :string
    field :email,        :string
    field :email_normalized, :string
    field :tos,          :boolean, virtual: true
    field :gender,       :integer
    field :city,         :string
    field :birthday,     :date
    field :bio,          :string
    field :pm_message,   :string
    field :hobbies,      :string
    field :api_key,      :string
    field :views,        :integer
    field :message_count, :integer
    field :last_access,  :utc_datetime
    field :profile_image,:string
    field :last_access_ip, :string
    field :banned, :boolean


    coherence_schema()
    timestamps()
  end

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, [:name, :email,
                      :password, :gender,
                      :city,
                      :birthday, :bio,
                      :pm_message, :hobbies,
                      :tos]
                      ++ coherence_fields)
    |> validate()
    |> validate_coherence(params)
  end

  def changeset(model, params, :registration) do
    if model.id do
      changeset(model, params, :registration_edit)
    else
      changeset(model, params, :registration_new)
    end
  end

  def changeset(model, params, :password) do
    model
    |> cast(params, [:name, :email,
                    :password, :gender,
                    :city,
                    :birthday, :bio,
                    :pm_message, :hobbies,
                    :tos]
                    ++ coherence_fields)
    |> validate_coherence_password_reset(params)
  end

  def changeset(model, params, :registration_new) do
    # custom changeset  for registration controller
    res = model
    |> cast(params, [:name, :email,
                      :password, :gender,
                      :city,
                      :birthday, :bio,
                      :pm_message, :hobbies,
                      :tos]
                      ++ coherence_fields)
    |> validate()
    |> validate_coherence(params)
    |> block_emails()
    |> set_api_key()
    IO.inspect(res)
    res
  end

  def changeset(model, params, :registration_edit) do
    # custom changeset  for registration controller
    model
    |> cast(params, [:password, :gender,
                      :city,
                      :birthday, :bio,
                      :pm_message, :hobbies,
                      :tos]
                      ++ coherence_fields)
    |> validate_coherence(params)
    |> validate()
    |> process_avatar(params)
  end

  def changeset(model, params, _which) do
    # use the default changeset for all other coherence controllers
    changeset model, params
  end

  def validate(changeset) do
    changeset
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r<(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])>)
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/)
    |> unique_constraint(:email)
    |> unique_constraint(:name)
    |> validate_length(:city, max: 64)
    |> validate_length(:name, min: 1, max: 24)
    |> validate_length(:email, min: 3, max: 64)
    |> validate_inclusion(:gender, [1, 2])
  end

  def set_api_key(changeset) do
    api_key = :crypto.strong_rand_bytes(15) |> Base.url_encode64 |> binary_part(0, 15)
    case changeset.valid? do
      true -> put_change(changeset, :api_key, api_key)
      false -> changeset
    end
  end

  def block_emails(changeset) do
    case changeset.valid? do
      true -> 
        if String.contains?(changeset.changes.email, "@qq.com") do
          add_error(changeset, :email, "")
        else
          changeset
        end
      false -> changeset
    end
  end

  def process_avatar(changeset, attrs) do
    if changeset.valid? do
      case attrs do
        %{"avatar" => (%Plug.Upload{} = file)} ->
          if Enum.member?(["image/jpg", "image/jpeg", "image/png"], file.content_type) do
            img_id = :crypto.strong_rand_bytes(5) |> Base.url_encode64 |> binary_part(0, 5)
            Mogrify.open(file.path)
            |> Mogrify.format("jpg")
            |> Mogrify.resize_to_limit("100x150")
            |> Mogrify.save(path: "../images/avatar/#{img_id}.jpg")

            put_change(changeset, :profile_image, "#{img_id}.jpg")
          else
            add_error(changeset, :avatar, "File must be a png or jpg")
          end
        _ -> changeset
      end
    else
      changeset
    end
  end


end

