# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :scrumpoker,
  ecto_repos: [ScrumPoker.Repo]

# Configures the endpoint
config :scrumpoker, ScrumPokerWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "dUCw+1MVXkDsM2Q7ojO44F1x0jS/BsYFAu27pEyAzDqKipsdCLZ/cmzFTgHum7zt",
  render_errors: [view: ScrumPokerWeb.ErrorView, accepts: ~w(html json)],
  pubsub_server: ScrumPokerWeb.PubSub,
  live_view: [signing_salt: "y4l6Jmw6"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
