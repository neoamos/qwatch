# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :bread,
  ecto_repos: [Bread.Repo]

# Configures the endpoint
config :bread, BreadWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "p5D/Hep188pytpejBjeQUTMMLEhSEkjHaB9bWovhHoI0bfYUEvYNtAtyfX6y9TgG",
  render_errors: [view: BreadWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Bread.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# %% Coherence Configuration %%   Don't remove this line
config :coherence,
  user_schema: Bread.Accounts.User,
  repo: Bread.Repo,
  module: Bread,
  web_module: BreadWeb,
  router: BreadWeb.Router,
  messages_backend: BreadWeb.Coherence.Messages,
  logged_out_url: "/",
  email_from_name: "Bread",
  email_from_email: "admin@bread.com",
  opts: [:rememberable, :authenticatable, :recoverable, :lockable, :trackable, :unlockable_with_token, :confirmable, :registerable],
  changeset: {Bread.Accounts.User, :changeset},
  user_token: true,
  rememberable_cookie_expire_hours: 365*24,
  registration_permitted_attributes: ["email","name","password", "current_password", "password_confirmation", "tos", "country_id", "birthday", "city", "bio", "hobbies", "pm_message", "gender", "avatar"]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
