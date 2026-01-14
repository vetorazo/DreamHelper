#!/bin/bash

# Download bubble icons from tlidb.com
# These are game assets - using with attribution as a fan project

ICON_DIR="public/icons/bubbles"
mkdir -p "$ICON_DIR"

BASE_URL="https://cdn.tlidb.com/UI/Textures/Common/Icon/GamePlay"

# Bubble types and their naming in the URLs
declare -A BUBBLE_TYPES=(
  ["Gear"]="Equip"
  ["Blacksail"]="BlackSail"
  ["Cube"]="Cube"
  ["Commodity"]="Commodity"
  ["Netherrealm"]="Netherrealm"
  ["Fluorescent"]="Fluorescent"
  ["Whim"]="Almighty"
)

# Quality tiers and their codes
declare -A QUALITIES=(
  ["White"]="W"
  ["Blue"]="B"
  ["Purple"]="P"
  ["Orange"]="O"
  ["Red"]="R"
  ["Rainbow"]="C"
)

echo "Downloading bubble icons..."
echo "================================"

for bubble_name in "${!BUBBLE_TYPES[@]}"; do
  url_name="${BUBBLE_TYPES[$bubble_name]}"
  
  for quality_name in "${!QUALITIES[@]}"; do
    quality_code="${QUALITIES[$quality_name]}"
    
    # Construct URL and filename
    url="${BASE_URL}/UI_Item_S5Gameplay_DreamTreasure_${url_name}_${quality_code}_128.webp"
    output="${ICON_DIR}/${bubble_name}_${quality_name}.webp"
    
    echo "Downloading: ${bubble_name} ${quality_name}..."
    
    # Download with curl
    if curl -s -f -o "$output" "$url"; then
      echo "  ✓ Saved: $output"
    else
      echo "  ✗ Failed: $url"
    fi
  done
done

echo "================================"
echo "Download complete!"
echo "Icons saved to: $ICON_DIR"
echo ""
echo "Remember to add attribution in your app!"
