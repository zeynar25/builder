// globalStyles.js
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
    main: {
        backgroundColor: theme.colors.mono,
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.max,
    },

    userform: {
        alignItems: 'center',
    },


    titleUnderline: {
        width: 150,
        height: 3,
        backgroundColor: theme.colors.highlight,
        borderRadius: theme.radii.sm,
        marginBottom: theme.spacing.xl,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
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
        fontFamily: "Rubik",
    },

    textTitle: {
        fontSize: theme.typography.fontSize.highlight,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        fontFamily: 'Rubik',
    },

    textError: {
        color: "#cc0000",
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSize.text,
        fontFamily: "Rubik",
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
        color: "#fff",
        fontSize: theme.typography.fontSize.text,
        fontWeight: theme.typography.fontWeight.bold,
        fontFamily: "Rubik",
    },
});
