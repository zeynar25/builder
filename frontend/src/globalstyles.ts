// globalStyles.js
import { StyleSheet, Dimensions } from 'react-native';
import { theme } from './theme';

const { width: screenWidth } = Dimensions.get('window');


export const globalStyles = StyleSheet.create({
    main: {
        backgroundColor: theme.colors.mono,
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: screenWidth * 0.20,
        paddingHorizontal: screenWidth * 0.10,
    },

    page : {
        backgroundColor: theme.colors.mono,
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        
    },

    pageFiller : {
        height: 96,
        backgroundColor: "transparent",
    },

    userform: {
        alignItems: 'flex-start',
    },


    titleUnderline: {
        width: 90,
        height: 3,
        backgroundColor: theme.colors.highlight,
        borderRadius: theme.radii.sm,
        marginBottom: theme.spacing.lg,
    },

    pageContainer: {
        alignSelf: 'flex-start',
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xs,
        borderBottomColor: theme.colors.highlight,
        borderBottomWidth: 2,
        marginBottom: theme.spacing.lg,
    },

    inputContainer: {
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
    },

    pageHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 68,

        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.mono,
        borderRadius: theme.radii.pill,
        marginHorizontal: screenWidth * 0.08,

        // 🔹 iOS shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 12,

        // 🔹 Android shadow
        elevation: 8,
    },

    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100%",
    },

    accountInfoContainer: {
        flexDirection: "column",
    },

    chronContainer: {
        flexDirection: "row", 
        alignItems: "center", 
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.accent_3,
        borderRadius: theme.radii.md,
    },

    
    // ==== textStyles ====

    TextLabel: {
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.primary,
        marginBottom: 8,
        alignSelf: "flex-start",
        fontFamily: "Rubik",
        marginTop: theme.spacing.sm,
    },

    textInput: {
        flex: 1,
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.primary,
        marginLeft: 12,
        fontFamily: theme.typography.fontFamily.primary,
    },

    textTitle: {
        fontSize: theme.typography.fontSize.highlight,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
    },

    textError: {
        color: "#cc0000",
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSize.text,
        fontFamily: theme.typography.fontFamily.primary,
    },


    variantTitle:{
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
    },

    variantLabel:{
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.primary,
    },

    variantAccountName: {
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    variantProfile: {
        color: theme.colors.highlight,
        fontFamily: theme.typography.fontFamily.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    variantBalance: {
        color: theme.colors.text.inverse,
        fontFamily: theme.typography.fontFamily.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    variantAccent:{
        color: theme.colors.accent_2,
        fontFamily: theme.typography.fontFamily.primary,
    },


    // ==== buttonStyles ====

    primaryButton: {
        backgroundColor: theme.colors.highlight,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radii.md,
        alignItems: "center",
        width: "100%",
        marginBottom: 24,
    },

    primaryButtonDisabled: {
        opacity: 0.7,
    },
  
    primaryButtonText: {
        color: theme.colors.mono,
        fontSize: theme.typography.fontSize.text,
        fontWeight: theme.typography.fontWeight.bold,
        fontFamily: theme.typography.fontFamily.primary,
    },

    secondaryButton: {
        backgroundColor: theme.colors.highlight,
        flexDirection: "row",
        borderRadius: theme.radii.md,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
});
