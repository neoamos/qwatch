# In this file, we load production configuration and secrets
# from environment variables. You can also hardcode secrets,
# although such is generally not recommended and you have to
# remember to add this file to your .gitignore.
use Mix.Config

database_url =
  System.get_env("DATABASE_URL") ||
    raise """
    environment variable DATABASE_URL is missing.
    For example: ecto://USER:PASS@HOST/DATABASE
    """

config :qwatch, Qwatch.Repo,
  # ssl: true,
  url: database_url,
  ssl: true,
  # ssl_opts: [certfile: "/home/qwatch/certs/db-cert.ca"], 
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

secret_key_base =
  System.get_env("SECRET_KEY_BASE") ||
    raise """
    environment variable SECRET_KEY_BASE is missing.
    You can generate one by calling: mix phx.gen.secret
    """

email_password =
  System.get_env("EMAIL_PASSWORD") ||
    raise """
    environment variable SECRET_KEY_BASE is missing.
    You can generate one by calling: mix phx.gen.secret
    """

config :qwatch, QwatchWeb.Endpoint,
  http: [
    port: String.to_integer(System.get_env("PORT") || "4000"),
    transport_options: [socket_opts: [:inet6]]
  ],
  secret_key_base: secret_key_base,
  server: true


config :coherence, QwatchWeb.Coherence.Mailer,
  adapter: Swoosh.Adapters.SMTP,
  relay: "mail.gandi.net",
  username: "support@qwatch.tv",
  password: email_password,
  tls: :always,
  auth: :always,
  port: 587,
  retries: 5,
  no_mx_lookups: false

# ## Using releases (Elixir v1.9+)
#
# If you are doing OTP releases, you need to instruct Phoenix
# to start each relevant endpoint:
#
#     config :qwatch, QwatchWeb.Endpoint, server: true
#
# Then you can assemble a release by calling `mix release`.
# See `mix help release` for more information.
