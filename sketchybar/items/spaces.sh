#!/usr/bin/env sh



sketchybar --add space space.1 left                   \
	--set space.1 associated_space=1              \
	--set space.1 associated_display=1            \
	label="1"                                     \
	icon=                                        \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \
	
sketchybar --add space space.2 left                   \
	--set space.2 associated_space=2              \
	--set space.2 associated_display=1            \
	label="2"                                     \
	icon=                                        \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \
	
sketchybar --add space space.3 left                   \
	--set space.3 associated_space=3              \
	--set space.3 associated_display=2            \
	label="3"                                     \
	icon=                                        \
	icon.color=$BLUE                              \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \

sketchybar --add space space.4 left                   \
	--set space.4 associated_space=4              \
	--set space.4 associated_display=2            \
	label="4"                                     \
	icon=ﭮ                                        \
	icon.color=$MAGENTA                              \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \

sketchybar --add space space.5 left                   \
	--set space.5 associated_space=5              \
	--set space.5 associated_display=2            \
	label="5"                                     \
	icon=                                        \
	icon.color=$GREEN                              \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \
sketchybar --add space space.6 left                   \
	--set space.6 associated_space=6              \
	--set space.6 associated_display=3            \
	label="6"                                     \
	icon=                                        \
	icon.color=$GREEN                              \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \
sketchybar --add space space.7 left                   \
	--set space.7 associated_space=7              \
	--set space.7 associated_display=3            \
	label="7"                                     \
	icon=                                        \
	icon.color=$GREEN                              \
     icon.highlight=on                                 \
     icon.highlight_color=$ICON_COLOR                  \
        script="$PLUGIN_DIR/space.sh"                 \
        click_script="$SPACE_CLICK_SCRIPT" \
sketchybar --add bracket spaces space.1 space.2           \
           --set spaces  background.color=$TRANSPARENT    \
           --set spaces  associated_display=1             

sketchybar --add bracket spaces space.3 space.4 space.5   \
           --set spaces  background.color=$TRANSPARENT    \
           --set spaces  associated_display=2             

sketchybar --add bracket spaces space.6 space.7   \
           --set spaces  background.color=$TRANSPARENT    \
           --set spaces  associated_display=3             

