import React from "react";
import { View, Image } from "react-native";
import { Text } from "react-native-paper";
import { globalStyles } from "@/src/globalstyles";
import { theme } from "@/src/theme";
import { getImageSource } from "../imageMap";

const chronIcon = require("../../assets/images/chrons.png");
const defaultTile = require("../../assets/images/road-connectors/default-tile.png");

interface PageHeaderProps {
  accountDetail?: any;
}

export default function PageHeader({ accountDetail }: PageHeaderProps) {
  const profileImg =
    `../../assets/images/profiles/${accountDetail?.accountDetail?.imageUrl}` ||
    `../../assets/images/profiles/1.png`;

  return (
    <View style={globalStyles.pageHeader}>
      <View style={globalStyles.headerContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={getImageSource(profileImg) || defaultTile}
            style={{
              width: theme.icon.navbar,
              height: theme.icon.navbar,
              borderRadius: theme.icon.navbar / 2,
              marginRight: theme.spacing.md,
              borderWidth: 2,
              borderColor: theme.colors.support,
            }}
            resizeMode="cover"
          />
          <View>
            <Text variant="titleMedium" style={globalStyles.variantAccountName}>
              {accountDetail?.accountDetail?.gameName || "Player"}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.text.secondary }}
            >
              Lvl {Math.floor((accountDetail?.accountDetail?.exp ?? 0) / 1000)}{" "}
              • {accountDetail?.accountDetail?.exp ?? 0} XP
            </Text>
          </View>
        </View>
        <View style={globalStyles.chronContainer}>
          <Image
            source={chronIcon}
            style={{ width: 20, height: 20, marginRight: 6 }}
            resizeMode="contain"
          />
          <Text variant="titleSmall" style={globalStyles.variantBalance}>
            {accountDetail?.accountDetail?.chron ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
