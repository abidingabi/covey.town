{
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05"; };

  outputs = { self, nixpkgs }:
    let
      # User-friendly version number
      version = builtins.substring 0 8 self.lastModifiedDate;

      # System types to support
      supportedSystems =
        [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      nixpkgsFor = forAllSystems (system: nixpkgs.legacyPackages.${system});
    in {
      devShells = forAllSystems (system:
        let pkgs = nixpkgsFor.${system};
        in {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs_18
              # needed for some of our dependencies
              python39
              pkg-config
              pixman
              cairo
              pango
            ];
          };
        });
    };
}
