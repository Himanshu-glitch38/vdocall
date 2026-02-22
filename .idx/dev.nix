# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    # pkgs.go
    # pkgs.python311
    # pkgs.python311Packages.pip
    pkgs.nodejs_20 # <-- UNCOMMENTED: Required to run 'npm' commands
    # pkgs.nodePackages.nodemon
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
  previews = {
    enable = true; # Ensures previews are active
    previews = {
      web = {
        command = ["npm" "run" "start" "--" "--port" "$PORT" "--host" "0.0.0.0"];
        manager = "web";
        env = {
          PORT = "$PORT"; # IDX automatically assigns a port
        };
      };
    };
  };
};
}
